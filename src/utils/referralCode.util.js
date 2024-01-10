const A = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];

      const generateReferralCode = async ()=>{
        const C1 = A[Math.floor(0 + Math.random() * 25)]
        const C2 = A[Math.floor(0 + Math.random() * 25)]
        const C3 = Math.floor(1 + Math.random() * 8)
        const C4 = Math.floor(1 + Math.random() * 8)
        const C5 = A[Math.floor(0 + Math.random() * 25)]
        const C6 = Math.floor(1 + Math.random() * 8)
  
        const rcode = C1+C2+C3+C4+C5+C6
        return rcode;
      }

module.exports.generateReferralCode = {
    generateReferralCode
}