(*---
description: Evaluates a random set expression, seed 262, number 4765.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04765 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(DOMAIN (b7442 :> b7442) + (CHOOSE b7443 \in DOMAIN [x \in 1..2 |-> x] : (\E b7444 \in {x \in 1..3 : x > 1} : TRUE))) : b7442 \in (DOMAIN (<<5, 6>> @@ (1 :> 2)) \cup {(1 % 2), Head(<<1, 2>>)})})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 18 to line 14, col 23 of module random_04765 and +.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 25.
    | Expression starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 17.
    | Expression starting at line 14, column 17.
    | Some { } form starting at line 14, column 16.
    | Fatal errors while parsing TLA+ spec in file random_04765
    | In module random_04765
    | Could not parse module random_04765 from file random_04765.tla
    | *** Errors: 1
    | In module random_04765
    | Could not parse module random_04765 from file random_04765.tla
    3002:1 Parsing or semantic analysis failed.
---*)
