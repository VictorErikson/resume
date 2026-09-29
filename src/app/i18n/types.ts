export interface Translations {
  photoAlt: string;
  role: string;
  summary: string;
  companyLabel: string;
  demosButton: string;
  onlineDemosLabel: string;
  headings: {
    contact: string;
    educationSide: string;
    hardSkills: string;
    softSkills: string;
    workExperience: string;
    languagesAndFrameworks: string;
    tools: string;
    education: string;
  };
  contacts: {
    telephone: string;
    telephoneValue: string;
    email: string;
    github: string;
    linkedin: string;
    address: string;
    addressValue: string;
    authorizedToWork: string;
  };
  experiences: ReadonlyArray<{
    title: string;
    bullets: string[];
  }>;
  edu: {
    detailTitle1: string;
    detailText: string;
    udemy: {
      title: string;
      before: string;
      linkText: string;
      after: string;
    };
    selfTaughtTitle: string;
    selfTaughtText: string;
    stanfordTitle: string;
    stanfordText: string;
    mobileDevTitle: string;
    mobileDevSchool: string;
    mobileDevText: string;
    dotnetTitle: string;
    dotnetSchool: string;
    dotnetText: string;
  };
  project: {
    heading: string;
    intro: string;
    bulletsTitle: string;
    bullets: string[];
  };
  aria: {
    scrollLangsLeft: string;
    scrollLangsRight: string;
    scrollToolsLeft: string;
    scrollToolsRight: string;
    copyTemplate: string;
    profileTemplate: string;
    langToggle: string;
    mobileNav: string;
    navContact: string;
    navDemos: string;
  };
}
