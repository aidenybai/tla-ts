(*---
description: A reserved word cannot be a substitution target.
ref: "tla2sany/parser/TLAplusParser.java#Substitution"
features: [reserved]
outcome: parse-error
---*)
---- MODULE used_as_substitution_target ----
---- MODULE Inner ----
CONSTANT c
====
INSTANCE Inner WITH IF <- 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "IF" at line 11, column 21 and token "WITH" 
    | Residual stack trace follows:
    | Substitution starting at line 11, column 21.
    | NonLocalInstance starting at line 11, column 1.
    | Instance starting at line 11, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file used_as_substitution_target
    | In module used_as_substitution_target
    | Could not parse module used_as_substitution_target from file used_as_substitution_target.tla
    | *** Errors: 1
    | In module used_as_substitution_target
    | Could not parse module used_as_substitution_target from file used_as_substitution_target.tla
    3002:1 Parsing or semantic analysis failed.
---*)
