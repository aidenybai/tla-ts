(*---
description: "(+) lexes as one token, the circled plus, so Ap(+) is a parse error at the end of the module."
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE paren_plus_lexes_as_circled_plus ----
EXTENDS Naturals
Ap(F(_)) == F(1)
A == Ap(+)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "====" at line 11, column 1 and token "(+)" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 11, column 1.
    | ExtendableExpr starting at line 10, column 6.
    | Expression starting at line 10, column 6.
    | Definition starting at line 10, column 1.
    | Module body starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file paren_plus_lexes_as_circled_plus
    | In module paren_plus_lexes_as_circled_plus
    | Could not parse module paren_plus_lexes_as_circled_plus from file paren_plus_lexes_as_circled_plus.tla
    | *** Errors: 1
    | In module paren_plus_lexes_as_circled_plus
    | Could not parse module paren_plus_lexes_as_circled_plus from file paren_plus_lexes_as_circled_plus.tla
    3002:1 Parsing or semantic analysis failed.
---*)
