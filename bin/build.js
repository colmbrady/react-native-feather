const fs = require('fs');
const glob = require('glob');
const camelcase = require('camelcase');
const uppercamelcase = require('uppercamelcase');
const path = require('path');
const cheerio = require('cheerio');
const prettier = require('prettier');

const rootDir = path.join(__dirname, '..');

glob(`${rootDir}/src/feather/icons/**.svg`, (err, icons) => {
  fs.writeFileSync(path.join(rootDir, 'src', 'index.js'), '', 'utf-8');

  icons.forEach((i) => {
    const svg = fs.readFileSync(i, 'utf-8');
    const id = path.basename(i, '.svg');
    const $ = cheerio.load(svg, {
      xmlMode: true,
    });
    const fileName = path.basename(i).replace('.svg', '.js');
    const location = path.join(rootDir, 'src/icons', fileName);

    // Because CSS does not exist on Native platforms
    // We need to duplicate the styles applied to the
    // SVG to its children
    const svgAttribs = $('svg')[0].attribs;
    delete svgAttribs['xmlns'];
    const attribsOfInterest = {};
    Object.keys(svgAttribs).forEach((key) => {
      if (key !== 'height'
        && key !== 'width' && key !== 'viewBox') {
        attribsOfInterest[key] = svgAttribs[key];
      }
    });
    $('*').each((index, el) => {
      Object.keys(el.attribs).forEach((x) => {
        if (x.includes('-')) {
          $(el).attr(camelcase(x), el.attribs[x]).removeAttr(x);
        }
        if (x === 'stroke') {
          $(el).attr(x, 'currentColor');
        }
      });

      // For every element that is NOT svg ...
      if (el.name !== 'svg') {
        Object.keys(attribsOfInterest).forEach((key) => {
          $(el).attr(camelcase(key), attribsOfInterest[key]);
        });
      }

      if (el.name === 'svg') {
        $(el).attr('otherProps', '...');
      }
    });

    const element = `
      import React from 'react';
      import PropTypes from 'prop-types';
      import {
        Svg,
        Circle as _Circle,
        Ellipse,
        G,
        LinearGradient,
        RadialGradient,
        Line,
        Path,
        Polygon,
        Polyline,
        Rect,
        Symbol,
        Text,
        Use,
        Defs,
        Stop
      } from 'react-native-svg';

      const ${uppercamelcase(id)} = (props) => {
        const { color, size, ...otherProps } = props;
        return (
          ${
      $('svg').toString()
        .replace(new RegExp('stroke="currentColor"', 'g'), 'stroke={color}')
        .replace('width="24"', 'width={size}')
        .replace('height="24"', 'height={size}')
        .replace('otherProps="..."', '{...otherProps}')
        .replace('<svg', '<Svg')
        .replace('</svg', '</Svg')
        .replace('<circle', '<_Circle')
        .replace('</circle', '</_Circle')
        .replace('<ellipse', '<Ellipse')
        .replace('</ellipse', '</Ellipse')
        .replace('<g', '<G')
        .replace('</g', '</G')
        .replace('<linear-gradient', '<LinearGradient')
        .replace('</linear-gradient', '</LinearGradient')
        .replace('<polygon', '<Polygon')
        .replace('</polygon', '</Polygon')
        .replace('<polyline', '<Polyline')
        .replace('</polyline', '</Polyline')
        .replace('<rect', '<Rect')
        .replace('</rect', '</Rect')
        .replace('<symbol', '<Symbol')
        .replace('</symbol', '</Symbol')
        .replace('<text', '<Text')
        .replace('</text', '</Text')
        .replace('<use', '<Use')
        .replace('</use', '</Use')
        .replace('<defs', '<Defs')
        .replace('</defs', '</Defs')
        .replace('<stop', '<Stop')
        .replace('</stop', '</Stop')
      }
        )
      };

      ${uppercamelcase(id)}.propTypes = {
        color: PropTypes.string,
        size: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number
        ]),
      }

      ${uppercamelcase(id)}.defaultProps = {
        color: 'black',
        size: '24',
      }

      export default ${uppercamelcase(id)}
    `;

    const component = prettier.format(element, {
      singleQuote: true,
      trailingComma: 'es5',
      bracketSpacing: true,
      parser: 'flow',
    });

    fs.writeFileSync(location, component, 'utf-8');

    const exportString = `export ${uppercamelcase(id)} from './icons/${id}';\r\n`;
    fs.appendFileSync(path.join(rootDir, 'src', 'index.js'), exportString, 'utf-8');
  });
});
