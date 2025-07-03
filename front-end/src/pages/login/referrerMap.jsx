const referrerMap = {
    alicestern : 'Alice',
    brandongallegos: null,
    davidgallegos: 'David',
    ruthgallegos: 'Ruth',
    compassionatecoachfiona: 'Fiona',
};

export const mapRefferer = (referrer) => {
    if (referrerMap[referrer]) {
        return referrerMap[referrer];
    } else {
        return "";
    }
}