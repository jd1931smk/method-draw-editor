# Method Draw - CopyCat ACT Fork

This is a fork of [Method Draw](https://github.com/methodofaction/Method-Draw) for the CopyCat ACT project.

Method Draw is a web-based vector drawing application that provides a simple and easy-to-use SVG editor experience.

## Live Demo

This fork is deployed at: [Your Netlify URL will go here]

## Changes from Original

- Configured for Netlify deployment
- Optimized build process for static hosting
- Integrated with CopyCat ACT SVG editing workflow

## Development

To run locally:

```bash
npm install
npx gulp build
cd dist
python -m http.server 8000
```

Then visit `http://localhost:8000`

## Deployment

This project is configured for automatic deployment on Netlify via the `netlify.toml` configuration.

## Original Method Draw

Method Draw was created by Mark MacKay and is published under the MIT License.

Based on the original Method Draw project: https://github.com/methodofaction/Method-Draw

#### [Try Method Draw](https://editor.method.ac) online.

![Method Draw](https://method.ac/img/method-draw2021.png)

## Development

Develop and run a local web server under `src`;

```
cd src
python -m SimpleHTTPServer 8000
```

or if you have Python 3: 

```
cd src
python -m http.server 8000
```

## Build

Install dev dependencies:

`npm install`

Then you can build into `dist` by running:

`gulp build`

Deploy `dist` to your static file server of choice.

## Release notes

**2021.05.26** Minor redesign
**2021.05.12** Solved stability issues
**2021.02.15** Major code refactor  
**2021.01.15** Added new fonts  
**2021.01.01** Text handling improvements  
**2020.12.10** Gradient fixes on Windows and Safari MacOS  
**2020.08.04** Vast code simplification  
**2020.08.02** File clean-up and gulp build implemented  
**2020.08.01** Project thawed  
**2015.01.01** Project frozen  
**2013.01.01** Project forked from SVG-Edit  

Sponsor development by [donating to the author](https://method.ac/donate/).

Method Draw is Copyright (c)
Mark MacKay [mark@method.ac](mailto:mark@method.ac)

Published under an MIT License. Enjoy.
