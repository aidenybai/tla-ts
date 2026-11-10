(*---
description: Terminating Open Parentheses. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/modules.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE modules_terminating_open_parentheses ----
f[x \in Nat] == (

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "<EOF>" at line 9, column 18 and token "(" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 18.
    | Expression starting at line 9, column 18.
    | ExtendableExpr starting at line 9, column 17.
    | Expression starting at line 9, column 17.
    | Definition starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file modules_terminating_open_parentheses
    | In module modules_terminating_open_parentheses
    | Could not parse module modules_terminating_open_parentheses from file modules_terminating_open_parentheses.tla
    | *** Errors: 1
    | In module modules_terminating_open_parentheses
    | Could not parse module modules_terminating_open_parentheses from file modules_terminating_open_parentheses.tla
    3002:1 Parsing or semantic analysis failed.
---*)
