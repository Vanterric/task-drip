const referrerMap = {
    alicestern : 'Alice',
    brandongallegos: "Brandon",
}

export const mapRefferer = (referrer) => {
    if (referrerMap[referrer]) {
        return referrerMap[referrer];
    } else {
        return referrer;
    }
}