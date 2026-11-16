(*---
description: Evaluates a random set expression, seed 262, number 3418.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03418 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{[a |-> 2147483647, b |-> TRUE] : b5425 \in (2147483647 .. 2)}, {(FALSE * -1), (2 - -1)}} \ ({[[x \in 1..2 |-> x] EXCEPT ![2147483647] = b5426] : b5426 \in {b5427 : b5427 \in {}}} \ (DOMAIN [x \in 1..2 |-> x] \cup (2147483647 .. 1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 96 to line 14, col 96 of module random_03418 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 90.
    | Expression starting at line 14, column 90.
    | ExtendableExpr starting at line 14, column 89.
    | Expression starting at line 14, column 89.
    | Some { } form starting at line 14, column 88.
    | Fatal errors while parsing TLA+ spec in file random_03418
    | In module random_03418
    | Could not parse module random_03418 from file random_03418.tla
    | *** Errors: 1
    | In module random_03418
    | Could not parse module random_03418 from file random_03418.tla
    3002:1 Parsing or semantic analysis failed.
---*)
