(*---
description: After a keyword first field a second keyword field is still rejected.
ref: "tla2sany/parser/TLAplusParser.java#SBracketCases"
features: [fields]
outcome: parse-error
---*)
---- MODULE keyword_first_then_keyword ----
Test == [IF |-> 1, THEN |-> 2].IF = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "THEN" at line 8, column 20 and token "," 
    | Residual stack trace follows:
    | Field Value starting at line 8, column 20.
    | Some [] Form starting at line 8, column 9.
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file keyword_first_then_keyword
    | In module keyword_first_then_keyword
    | Could not parse module keyword_first_then_keyword from file keyword_first_then_keyword.tla
    | *** Errors: 1
    | In module keyword_first_then_keyword
    | Could not parse module keyword_first_then_keyword from file keyword_first_then_keyword.tla
    3002:1 Parsing or semantic analysis failed.
---*)
