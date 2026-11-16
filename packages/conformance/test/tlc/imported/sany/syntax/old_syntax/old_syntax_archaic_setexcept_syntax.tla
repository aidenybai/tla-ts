(*---
description: Archaic SetExcept Syntax. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/old_syntax.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE old_syntax_archaic_setexcept_syntax ----
x == {| S EXCEPT !.name = e |}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "S" at line 9, column 9 and token "|" 
    | Residual stack trace follows:
    | Some { } form starting at line 9, column 6.
    | ExtendableExpr starting at line 9, column 6.
    | Expression starting at line 9, column 6.
    | Definition starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file old_syntax_archaic_setexcept_syntax
    | In module old_syntax_archaic_setexcept_syntax
    | Could not parse module old_syntax_archaic_setexcept_syntax from file old_syntax_archaic_setexcept_syntax.tla
    | *** Errors: 1
    | In module old_syntax_archaic_setexcept_syntax
    | Could not parse module old_syntax_archaic_setexcept_syntax from file old_syntax_archaic_setexcept_syntax.tla
    3002:1 Parsing or semantic analysis failed.
---*)
