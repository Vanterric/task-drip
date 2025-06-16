const referrerMap = {
    alicestern : 'Alice',
    brandongallegos: null,
    davidgallegos: 'David',
    ruthgallegos: 'Ruth',
}

export const mapRefferer = (referrer) => {
    if (referrerMap[referrer]) {
        return referrerMap[referrer];
    } else {
        return "";
    }
}