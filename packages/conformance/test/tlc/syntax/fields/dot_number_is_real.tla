(*---
description: r.1 reads the dot as part of a decimal-free selection and the number is not a field.
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
outcome: parse-error
---*)
---- MODULE dot_number_is_real ----
Test == [a |-> 1].1 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 8, column 19 and token "." 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file dot_number_is_real
    | In module dot_number_is_real
    | Could not parse module dot_number_is_real from file dot_number_is_real.tla
    | *** Errors: 1
    | In module dot_number_is_real
    | Could not parse module dot_number_is_real from file dot_number_is_real.tla
    3002:1 Parsing or semantic analysis failed.
---*)
