import React from 'react';
import { Link } from 'react-router-dom'; 
import classes from './Breadcrumbs.module.css';

/**
 * A reusable breadcrumbs component with clickable and non-clickable links.
 * @param {object} props - The component props.
 * @param {string[]} props.path - An array of strings representing the path segments.
 * @param {string[]} [props.nonLinkSegments=[]] - Segments that should not be links (e.g., 'Admissions').
 */
const Breadcrumbs = ({ path = [], nonLinkSegments = [] }) => {
  let currentPath = '';

  return (
    <nav className={classes.breadcrumbs} aria-label="breadcrumb">
      {path.map((segment, index) => {
        const slug = segment.toLowerCase().replace(/\s+/g, '-');
        currentPath += `/${slug}`;
        const isLast = index === path.length - 1;
        const isNonLink = nonLinkSegments.includes(segment);

        return (
          <React.Fragment key={currentPath}>
            {isLast || isNonLink ? (
              <span className={`${classes.pathSegment} ${classes.active}`}>
                {segment}
              </span>
            ) : (
              <Link to={currentPath} className={classes.pathSegment}>
                {segment}
              </Link>
            )}

            {!isLast && <span className={classes.separator}>/</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
