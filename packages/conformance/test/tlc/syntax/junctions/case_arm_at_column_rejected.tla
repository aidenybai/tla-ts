(*---
description: "A CASE separator at the bullet's column does not continue the CASE."
ref: "tla2sany/parser/TLAplusParser.java#caseSep"
features: [junctions]
outcome: parse-error
---*)
---- MODULE case_arm_at_column_rejected ----
Test ==
  /\ CASE TRUE -> TRUE
  [] FALSE -> TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "[]" at line 10, column 3 and token "TRUE" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file case_arm_at_column_rejected
    | In module case_arm_at_column_rejected
    | Could not parse module case_arm_at_column_rejected from file case_arm_at_column_rejected.tla
    | *** Errors: 1
    | In module case_arm_at_column_rejected
    | Could not parse module case_arm_at_column_rejected from file case_arm_at_column_rejected.tla
    3002:1 Parsing or semantic analysis failed.
---*)
