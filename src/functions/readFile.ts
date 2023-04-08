import imageConversion from 'image-conversion';

export async function readFile(file: File) {

    const f = async () => {
        const uncompressed = await imageConversion.filetoDataURL(file);
        const ogImage = await imageConversion.dataURLtoImage(uncompressed);
        return {uncompressed, ogImage}
    }

    const g = async () => {
        const compressed = await imageConversion.compressAccurately(file, {
            size: 50,
            width: 500,
        });

        const thumbnail = await imageConversion.filetoDataURL(compressed);
        const image = await imageConversion.dataURLtoImage(thumbnail);
        return {compressed, thumbnail, image};
    }

    const [{uncompressed, ogImage}, {compressed, thumbnail, image}] = await Promise.all([f(),g()]);

    const ogw = ogImage.width;
    const ogh = ogImage.height;
    const w = image.width;
    const h = image.height;

    return { compressed, uncompressed, thumbnail, w, h, ogw, ogh };
}
