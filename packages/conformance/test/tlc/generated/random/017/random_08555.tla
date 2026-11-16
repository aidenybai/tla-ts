(*---
description: Evaluates a random bool expression, seed 262, number 8555.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08555 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((FALSE \/ TRUE) * ((1 :> 2))[2]) + Cardinality({b13257 : b13257 \in 1..3})) \in (((2..1 \ {1}) \cup ({2, 1, 3} \ 1..3)) \ {(7 \div 2), (2147483647 \div -1)})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 166 to line 14, col 169 of module random_08555 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 155.
    | Expression starting at line 14, column 155.
    | ExtendableExpr starting at line 14, column 154.
    | Expression starting at line 14, column 154.
    | Some { } form starting at line 14, column 141.
    | Fatal errors while parsing TLA+ spec in file random_08555
    | In module random_08555
    | Could not parse module random_08555 from file random_08555.tla
    | *** Errors: 1
    | In module random_08555
    | Could not parse module random_08555 from file random_08555.tla
    3002:1 Parsing or semantic analysis failed.
---*)
