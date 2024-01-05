import { generateTickets } from './generateTickets.js';

// Sample data for testing (replace with actual data if needed)
const sampleSqlRows = [
  /* ... your sample SQL rows here ... */
  
    {"ticket_id":"24","ticket_order_id":"134","ticket_paypal_id":"0VB564105D224081Y","ticket_type":"3TMC","ticket_name":"3 Tage mit Camping","ticket_security_code":"MJBNFM","ticket_price":"60","ticket_payed":"1","ticket_checked_in":"0","ticket_holder_email":"Hans123@gmx.de","ticket_checked_in_time":null,"ticket_created_time":"2023-09-08 10:13:54","ticket_sent_time":null,"ticket_url":null},
    {"ticket_id":"25","ticket_order_id":"134","ticket_paypal_id":"0VB564105D224081Y","ticket_type":"3TMC","ticket_name":"3 Tage mit Camping","ticket_security_code":"RPEQTB","ticket_price":"60","ticket_payed":"1","ticket_checked_in":"0","ticket_holder_email":"Hans123@gmx.de","ticket_checked_in_time":null,"ticket_created_time":"2023-09-08 10:13:54","ticket_sent_time":null,"ticket_url":null},
    {"ticket_id":"26","ticket_order_id":"134","ticket_paypal_id":"0VB564105D224081Y","ticket_type":"3TMC","ticket_name":"3 Tage mit Camping","ticket_security_code":"L45GC4","ticket_price":"60","ticket_payed":"1","ticket_checked_in":"0","ticket_holder_email":"Hans123@gmx.de","ticket_checked_in_time":null,"ticket_created_time":"2023-09-08 10:13:54","ticket_sent_time":null,"ticket_url":null},
    // {"ticket_id":"27","ticket_order_id":"134","ticket_paypal_id":"0VB564105D224081Y","ticket_type":"3TMC","ticket_name":"3 Tage mit Camping","ticket_security_code":"4IVNWV","ticket_price":"60","ticket_payed":"1","ticket_checked_in":"0","ticket_holder_email":"Hans123@gmx.de","ticket_checked_in_time":null,"ticket_created_time":"2023-09-08 10:13:54","ticket_sent_time":null,"ticket_url":null},
    // {"ticket_id":"28","ticket_order_id":"134","ticket_paypal_id":"0VB564105D224081Y","ticket_type":"3TMC","ticket_name":"3 Tage mit Camping","ticket_security_code":"37GCU3","ticket_price":"60","ticket_payed":"1","ticket_checked_in":"0","ticket_holder_email":"Hans123@gmx.de","ticket_checked_in_time":null,"ticket_created_time":"2023-09-08 10:13:54","ticket_sent_time":null,"ticket_url":null},
    // {"ticket_id":"29","ticket_order_id":"134","ticket_paypal_id":"0VB564105D224081Y","ticket_type":"3TMB","ticket_name":"3 Tage mit Bus","ticket_security_code":"9MKI6K","ticket_price":"60","ticket_payed":"1","ticket_checked_in":"0","ticket_holder_email":"Hans123@gmx.de","ticket_checked_in_time":null,"ticket_created_time":"2023-09-08 10:13:54","ticket_sent_time":null,"ticket_url":null},
    // {"ticket_id":"30","ticket_order_id":"134","ticket_paypal_id":"0VB564105D224081Y","ticket_type":"3TMB","ticket_name":"3 Tage mit Bus","ticket_security_code":"FVPQH5","ticket_price":"60","ticket_payed":"1","ticket_checked_in":"0","ticket_holder_email":"Hans123@gmx.de","ticket_checked_in_time":null,"ticket_created_time":"2023-09-08 10:13:54","ticket_sent_time":null,"ticket_url":null},
    // {"ticket_id":"31","ticket_order_id":"134","ticket_paypal_id":"0VB564105D224081Y","ticket_type":"1TSA","ticket_name":"Samstag","ticket_security_code":"KHWRZ1","ticket_price":"35","ticket_payed":"1","ticket_checked_in":"0","ticket_holder_email":"Hans123@gmx.de","ticket_checked_in_time":null,"ticket_created_time":"2023-09-08 10:13:54","ticket_sent_time":null,"ticket_url":null}
    
    
];

try {
  generateTickets(sampleSqlRows)
  .then((ticketLinks) => {
    console.log("Ticket links:", ticketLinks);
    // Do something with the ticket links, such as sending them to the client
    for (const key in ticketLinks) {
      if (ticketLinks.hasOwnProperty(key)) {
        const ticket = ticketLinks[key];
        const securityCode = ticket.securityCode;
        const url = ticket.url;
        console.log(`Ticket ${key}: Security Code: ${securityCode}, Url: ${url}`);
      }
    }
  })
  .catch((error) => {
    console.error("Ticket generation error:", error);
  });

  console.log('Ticket generation successful.'); // Success message
} catch (error) {
  console.error('Ticket generation failed:', error); // Error message
}