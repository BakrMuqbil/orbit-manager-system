




const CompanyLedger =() => {
  
  
  return(
    <div>
    <PageHeader
  backPath="/home/Company"
  title="سجل الشركات "
  rightContent={
    <ul className={styles.rightList}>
      <li>  {bus?.owner_name || ' '}</li>
      <li> {driverName || ''}</li>
      <li> {bus?.busNumber}</li>
    </ul>
  }
/>
    </div>
    
    )
}