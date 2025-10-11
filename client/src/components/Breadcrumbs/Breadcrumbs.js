import React from 'react';
import { Link } from 'react-router-dom'; 
import styles from './Breadcrumbs.module.css';

const Breadcrumbs = ({ path = [], nonLinkSegments = [] }) => {
  let currentPath = '';

  return (
    <nav className={styles.breadcrumbs} aria-label="breadcrumb">
      {path.map((segment, index) => {
        const slug = (segment || '').toLowerCase().replace(/\s+/g, '-');
        currentPath += `/${slug}`;
        const isLast = index === path.length - 1;
        const isNonLink = nonLinkSegments.includes(segment);

        return (
          <React.Fragment key={currentPath}>
            {isLast || isNonLink ? (
              <span className={`${styles.pathSegment} ${styles.active}`}>
                {segment}
              </span>
            ) : (
              <Link to={currentPath} className={styles.pathSegment}>
                {segment}
              </Link>
            )}

            {!isLast && <span className={styles.separator}>/</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
