(*---
description: Evaluates a random bool expression, seed 262, number 9043.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09043 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2..1 \cap SUBSET {1}) \subseteq (7 .. 7)) => (SubSeq(<<>>, 2, 2) = ({2, 1, 3} @@ [x \in 1..2 |-> x]))) => (Cardinality(({} .. 0)) < (([a |-> 1, b |-> TRUE] \div -1) - (2147483647 \div 1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 176 to line 14, col 179 of module random_09043 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 154.
    | Expression starting at line 14, column 154.
    | ExtendableExpr starting at line 14, column 153.
    | Expression starting at line 14, column 153.
    | ExtendableExpr starting at line 14, column 152.
    | Fatal errors while parsing TLA+ spec in file random_09043
    | In module random_09043
    | Could not parse module random_09043 from file random_09043.tla
    | *** Errors: 1
    | In module random_09043
    | Could not parse module random_09043 from file random_09043.tla
    3002:1 Parsing or semantic analysis failed.
---*)
