(*---
description: Set Filter With Too Many Quantifiers. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/sets.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE sets_set_filter_with_too_many_quantifiers ----
op == {x \in Nat, y \in Int : P(x, y)}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered ":" at line 9, column 29 and token "Int" 
    | Residual stack trace follows:
    | Some { } form starting at line 9, column 7.
    | ExtendableExpr starting at line 9, column 7.
    | Expression starting at line 9, column 7.
    | Definition starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file sets_set_filter_with_too_many_quantifiers
    | In module sets_set_filter_with_too_many_quantifiers
    | Could not parse module sets_set_filter_with_too_many_quantifiers from file sets_set_filter_with_too_many_quantifiers.tla
    | *** Errors: 1
    | In module sets_set_filter_with_too_many_quantifiers
    | Could not parse module sets_set_filter_with_too_many_quantifiers from file sets_set_filter_with_too_many_quantifiers.tla
    3002:1 Parsing or semantic analysis failed.
---*)
