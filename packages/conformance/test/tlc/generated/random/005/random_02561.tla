(*---
description: Evaluates a random bool expression, seed 262, number 2561.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02561 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(SortSeq([a |-> 1, b |-> TRUE], LAMBDA p, q : p < q) = ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]))) /\ (((-1 \div -1) = (-SUBSET {1})) <=> ((\A b4036 \in 2..1 : FALSE) <=> (TRUE <=> FALSE)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 131 to line 14, col 134 of module random_02561 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 129.
    | Expression starting at line 14, column 128.
    | ExtendableExpr starting at line 14, column 127.
    | Expression starting at line 14, column 127.
    | ExtendableExpr starting at line 14, column 126.
    | Fatal errors while parsing TLA+ spec in file random_02561
    | In module random_02561
    | Could not parse module random_02561 from file random_02561.tla
    | *** Errors: 1
    | In module random_02561
    | Could not parse module random_02561 from file random_02561.tla
    3002:1 Parsing or semantic analysis failed.
---*)
