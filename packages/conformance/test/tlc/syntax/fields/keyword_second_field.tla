(*---
description: "The keyword allowance applies only to the first field, so a keyword in a later position is rejected."
ref: "tla2sany/parser/TLAplusParser.java#SBracketCases"
features: [fields]
outcome: parse-error
---*)
---- MODULE keyword_second_field ----
Test == [a |-> 1, IF |-> 2].a = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "IF" at line 8, column 19 and token "," 
    | Residual stack trace follows:
    | Field Value starting at line 8, column 19.
    | Some [] Form starting at line 8, column 9.
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file keyword_second_field
    | In module keyword_second_field
    | Could not parse module keyword_second_field from file keyword_second_field.tla
    | *** Errors: 1
    | In module keyword_second_field
    | Could not parse module keyword_second_field from file keyword_second_field.tla
    3002:1 Parsing or semantic analysis failed.
---*)
