import re

def convert_line(line):
    # Match large integers (timestamps) that are 13 digits long and surrounded by commas or parentheses
    # This avoids matching parts of long floating point numbers
    line = re.sub(r'\((\d{13}),', r'(FROM_UNIXTIME(\1/1000.0),', line)
    line = re.sub(r',(\d{13}),', r',FROM_UNIXTIME(\1/1000.0),', line)
    line = re.sub(r',(\d{13})\)', r',FROM_UNIXTIME(\1/1000.0))', line)
    return line

with open('migration_dump.sql', 'r') as f:
    lines = f.readlines()

with open('migration_mysql.sql', 'w') as f:
    f.write("SET FOREIGN_KEY_CHECKS = 0;\n")
    f.write("TRUNCATE TABLE Applicant;\n")
    f.write("TRUNCATE TABLE ApprovalDecision;\n")
    f.write("TRUNCATE TABLE CreditHistory;\n")
    f.write("TRUNCATE TABLE CreditScore;\n")
    f.write("TRUNCATE TABLE LoanApplication;\n")
    f.write("TRUNCATE TABLE LoanType;\n")
    f.write("TRUNCATE TABLE Officer;\n")
    f.write("TRUNCATE TABLE Repayment;\n")
    
    for line in lines:
        if line.startswith('INSERT INTO') and 'sqlite_sequence' not in line:
            # Convert timestamps
            new_line = convert_line(line)
            # Remove any SQLite specific syntax if needed (none found in simple inserts)
            f.write(new_line)
            
    f.write("SET FOREIGN_KEY_CHECKS = 1;\n")
