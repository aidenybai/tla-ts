(*---
description: An unnamed INSTANCE may not be in a LET.
ref: "tla2sany/parser/TLAplusParser.java#LetDefinitions"
features: [instance]
outcome: parse-error
---*)
---- MODULE let_unnamed_instance ----
---- MODULE I ----
====
Test == LET INSTANCE I IN TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "INSTANCE" at line 10, column 13 and token "LET" 
    | Residual stack trace follows:
    | Let Definitions starting at line 10, column 13.
    | Case Other Arm starting at line 10, column 9.
    | Expression starting at line 10, column 9.
    | Definition starting at line 10, column 1.
    | Module body starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file let_unnamed_instance
    | In module let_unnamed_instance
    | Could not parse module let_unnamed_instance from file let_unnamed_instance.tla
    | *** Errors: 1
    | In module let_unnamed_instance
    | Could not parse module let_unnamed_instance from file let_unnamed_instance.tla
    3002:1 Parsing or semantic analysis failed.
---*)
