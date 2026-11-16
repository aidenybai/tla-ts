(*---
description: Evaluates a random bool expression, seed 262, number 8369.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08369 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b12946 \in (UNION {SUBSET {1}, Nat} \ ({} \ {1, 2})) : ((Nat = {}) /\ (FALSE \/ TRUE))} = {b12947 \in ((3 \div -1) .. ([a |-> 1]).a) : (({} = [a |-> 1]) => Head(<<1, 2>>))}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 124 to line 14, col 127 of module random_08369 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 122.
    | Expression starting at line 14, column 122.
    | ExtendableExpr starting at line 14, column 121.
    | Expression starting at line 14, column 121.
    | ExtendableExpr starting at line 14, column 120.
    | Fatal errors while parsing TLA+ spec in file random_08369
    | In module random_08369
    | Could not parse module random_08369 from file random_08369.tla
    | *** Errors: 1
    | In module random_08369
    | Could not parse module random_08369 from file random_08369.tla
    3002:1 Parsing or semantic analysis failed.
---*)
