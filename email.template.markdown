---
# Example email message template for trello-mailer
# Message templates can optionally include YAML front matter that specifies
# from, to, cc, bcc, and subject fields. The message itself is written in
# Markdown, and Mustache variables can be mixed in anywhere.
to: "{{{to_recipients}}}"
cc: "{{{cc_recipients}}}"
subject: "Mobile Era - ikke gå glipp av Early Bird billettene!"
messageRef: "{{idCard}}"
attachments:
  - signature.png
---
Hi {{recipient_name}}

How are you doing at {{company}}?
  
  
Sincerely,    
~Me  
**My Full Name**, Software Developer  
[my@email.com](mailto:my@email.com) / [+47 555 55 555](callto:+4755555555)  
![Company - YES WE CAN](cid:logo-signature.png)  

