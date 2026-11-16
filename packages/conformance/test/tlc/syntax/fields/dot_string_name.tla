(*---
description: A string cannot name a field in a record constructor.
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
outcome: parse-error
---*)
---- MODULE dot_string_name ----
Test == ["a" |-> 1] = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "|->" at line 8, column 14 and token "\"a\"" 
    | Residual stack trace follows:
    | Some [] Form starting at line 8, column 9.
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file dot_string_name
    | In module dot_string_name
    | Could not parse module dot_string_name from file dot_string_name.tla
    | *** Errors: 1
    | In module dot_string_name
    | Could not parse module dot_string_name from file dot_string_name.tla
    3002:1 Parsing or semantic analysis failed.
---*)
