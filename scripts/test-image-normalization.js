const productService = require('../src/services/productService');

async function run() {
    const samples = [
        ['https://cdn.example.com/old/abc.jpg', 'https://cdn.example.com/old/def.png'],
        [{ detail: 'https://cdn.example.com/x/detail.webp' }, { detail: { filename: 'z-detail.webp', url: 'https://cdn.example.com/x/z-detail.webp' } }],
        // JSON string array
        JSON.stringify(['https://cdn.example.com/a.jpg', { detail: 'https://cdn.example.com/b-detail.webp' }]),
        // Single URL string
        'https://cdn.example.com/single.jpg',
        // Malformed JSON
        "[not a json]",
        // JS-string-concatenated payload (as in error stack) with URLs
        "[\n' +\n  '  {\\n' +\n  '    detail: {\\n' +\n  \"      url: 'https://turningpoint-assets.s3.ap-south-1.amazonaws.com/c763945af846f884a257e036da0b1123595ed919d31026c7526b35bad4bf98cc-detail.webp'\\n\" +\n  '    },\\n' +\n  '    thumb: {\\n' +\n  \"      url: 'https://turningpoint-assets.s3.ap-south-1.amazonaws.com/c763945af846f884a257e036da0b1123595ed919d31026c7526b35bad4bf98cc-thumb.webp'\\n\" +\n  '    }\\n' +\n  '  },\\n' +\n  '  {\\n' +\n  '    detail: {\\n' +\n  \"      url: 'https://turningpoint-assets.s3.ap-south-1.amazonaws.com/531ecae16f8a4071ec69df24142ffa590790cd929acbad4f527699d0f1d54778-detail.webp'\\n\" +\n  '    }\\n' +\n  '  }\\n' +\n  ']' ,
    ];

    for (const s of samples) {
        try {
            const res = productService.normalizeImagesArray(s);
            console.log('INPUT:', typeof s === 'string' ? s : JSON.stringify(s, null, 2));
            console.log('OUTPUT:', JSON.stringify(res, null, 2));
        } catch (err) {
            console.log('INPUT:', typeof s === 'string' ? s : JSON.stringify(s, null, 2));
            console.log('ERROR:', err.message);
        }
        console.log('-----');
    }
}

run();
