import Highcharts from 'highcharts/highstock';

const MS_PER_DAY = 86400000;

const downloadFile = (content, filename, mimeType) => {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

const escapeCsvField = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// Exports the series currently visible on the chart (including smoothing, alignment and forecasts),
// one row per x value. Hidden series and the navigator's internal series are skipped.
const exportChartAsCsv = (chart, filename, alignedToFirstScrobble) => {
    const columns = [];
    const rowsByX = new Map();

    const addValue = (x, columnIndex, value) => {
        if (!rowsByX.has(x)) rowsByX.set(x, []);
        rowsByX.get(x)[columnIndex] = value;
    };

    chart.series
        .filter(series => series.visible && !series.options.isInternal)
        .forEach(series => {
            const xData = series.xData || [];
            const yData = series.yData || [];

            if (series.type === 'arearange') {
                const baseName = series.linkedParent?.name ?? series.name;
                const lowColumn = columns.push(`${baseName} (Forecast low)`) - 1;
                const highColumn = columns.push(`${baseName} (Forecast high)`) - 1;
                xData.forEach((x, i) => {
                    addValue(x, lowColumn, yData[i]?.[0]);
                    addValue(x, highColumn, yData[i]?.[1]);
                });
            } else {
                const column = columns.push(series.name) - 1;
                xData.forEach((x, i) => addValue(x, column, yData[i]));
            }
        });

    const xHeader = alignedToFirstScrobble ? 'Days since first scrobble' : 'Date';
    const formatX = alignedToFirstScrobble
        ? (x) => Math.round(x / MS_PER_DAY)
        : (x) => new Date(x).toISOString().slice(0, 10);

    const lines = [[xHeader, ...columns].map(escapeCsvField).join(',')];
    [...rowsByX.keys()].sort((a, b) => a - b).forEach(x => {
        const values = rowsByX.get(x);
        const row = [formatX(x)];
        for (let i = 0; i < columns.length; i++) row.push(values[i]);
        lines.push(row.map(escapeCsvField).join(','));
    });

    // BOM so Excel reads non-ASCII names (e.g. "Sigur Rós") as UTF-8
    downloadFile('\uFEFF' + lines.join('\r\n'), filename, 'text/csv;charset=utf-8');
}

// Layout of the exported image, in chart pixels (the PNG is rendered at 2x)
const IMAGE_PADDING = 30;
const HEADER_HEIGHT = 70;
const HEADER_ICON_SIZE = 44;

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

// Images must be embedded as data URLs: the exported SVG is drawn onto a canvas, where external
// images either don't load or block reading the result
const loadLogoDataUrl = async () => {
    const response = await fetch(new URL('assets/icon.svg', document.baseURI));
    if (!response.ok) throw new Error(`Logo request failed: ${response.status}`);
    return blobToDataUrl(await response.blob());
}

// last.fm's image CDN allows cross-origin reads, so the avatar can be cropped to a circle on a canvas
const loadCircularAvatarDataUrl = async (avatarUrl) => {
    const response = await fetch(avatarUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`Avatar request failed: ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob());
    const size = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, size, size);
    return canvas.toDataURL('image/png');
}

const ignoreFailure = (promise, what) => promise.catch(error => {
    console.warn(`Chart image export: couldn't load ${what}, exporting without it`, error);
    return null;
});

// Draws the ScrobbleFlow logo (top left) and the user's avatar and name (top right) into the export
const drawImageHeader = (exportChart, { logoDataUrl, avatarDataUrl, username }) => {
    const renderer = exportChart.renderer;
    const iconY = IMAGE_PADDING;
    const textBaseline = iconY + HEADER_ICON_SIZE / 2;

    let logoTextX = IMAGE_PADDING;
    if (logoDataUrl) {
        renderer.image(logoDataUrl, IMAGE_PADDING, iconY, HEADER_ICON_SIZE, HEADER_ICON_SIZE).add();
        logoTextX += HEADER_ICON_SIZE + 12;
    }
    renderer.text('ScrobbleFlow', logoTextX, textBaseline + 2)
        .css({ color: '#ffffff', fontSize: '24px', fontWeight: 'bold' })
        .add();
    renderer.text('powered by last.fm', logoTextX, textBaseline + 20)
        .css({ color: '#b1b1b1', fontSize: '13px' })
        .add();

    let usernameRightX = exportChart.chartWidth - IMAGE_PADDING;
    if (avatarDataUrl) {
        renderer.image(avatarDataUrl, usernameRightX - HEADER_ICON_SIZE, iconY, HEADER_ICON_SIZE, HEADER_ICON_SIZE).add();
        usernameRightX -= HEADER_ICON_SIZE + 12;
    }
    if (username) {
        renderer.text(username, usernameRightX, textBaseline + 7)
            .attr({ align: 'right' })
            .css({ color: '#ffffff', fontSize: '18px' })
            .add();
    }
}

// Renders the chart as it currently appears (zoom, hidden series, navigator) to a PNG in the browser,
// with padding around it and a header showing the ScrobbleFlow logo and the user's avatar and name
const exportChartAsImage = async (chart, filename, { username, avatarUrl } = {}) => {
    const [logoDataUrl, avatarDataUrl] = await Promise.all([
        ignoreFailure(loadLogoDataUrl(), 'the logo'),
        avatarUrl ? ignoreFailure(loadCircularAvatarDataUrl(avatarUrl), 'the avatar') : null
    ]);

    const topSpacing = IMAGE_PADDING + HEADER_HEIGHT;
    // exportChartLocal doesn't return anything, so settle on its success event or error callback instead.
    // Resolves once the download has started; rejects if the image couldn't be rendered.
    return new Promise((resolve, reject) => {
        const removeSuccessListener = Highcharts.addEvent(chart, 'exportChartLocalSuccess', () => {
            removeSuccessListener();
            resolve();
        });
        chart.exportChartLocal({
            type: 'image/png',
            filename,
            error: (options, error) => {
                removeSuccessListener();
                reject(error);
            },
            // Grow the image by the added spacing so the plot itself keeps its on-screen size
            sourceWidth: chart.chartWidth + 2 * IMAGE_PADDING,
            sourceHeight: chart.chartHeight + topSpacing + IMAGE_PADDING,
            scale: 2
        }, {
            chart: {
                spacing: [topSpacing, IMAGE_PADDING, IMAGE_PADDING, IMAGE_PADDING],
                events: {
                    load() {
                        drawImageHeader(this, { logoDataUrl, avatarDataUrl, username });
                    }
                }
            },
            // The credit is positioned from the image corner, so move it inside the padding too
            credits: {
                position: { align: 'right', verticalAlign: 'bottom', x: -IMAGE_PADDING, y: -IMAGE_PADDING / 2 }
            }
        });
    });
}

export { exportChartAsCsv, exportChartAsImage }
