const referrerMapForDashboard = (email) => {
    const referrerMap = {
        "derrickgallegos@rocketmail.com": {
            name: "Derrick",
            referralLink: "derrickgallegos",
            superUser: true,
            percentShare: 1,
        },
        "brandonpkgallegos@gmail.com": {
            name: "Brandon",
            referralLink: "brandongallegos",
            percentShare: .3,
        },
        "regallegos2@yahoo.com": {
            name: "Ruth",
            referralLink: "ruthgallegos",
            percentShare: .1,
        },
        "dvgallegos@yahoo.com": {
            name: "David",
            referralLink: "davidgallegos",
            percentShare: .1,
        },
        "alice.c.stern@gmail.com": {
            name: "Alice",
            referralLink: "alicestern",
            percentShare: .1,
        },
    }

    if (referrerMap[email]) {
        return referrerMap[email];
    } else {
        return null;
    }
}
export default referrerMapForDashboard