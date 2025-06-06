const referrerMap = {
    alicestern : 'Alice',
    brandongallegos: null,
}

export const mapRefferer = (referrer) => {
    if (referrerMap[referrer]) {
        return referrerMap[referrer];
    } else {
        return "";
    }
}