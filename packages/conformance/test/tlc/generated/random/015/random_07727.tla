(*---
description: Evaluates a random record expression, seed 262, number 7727.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07727 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((CHOOSE b11917 \in SUBSET {1} : FALSE) :> (-1 \div -1)))[Cardinality(({2, 1, 3} \ {}))], b |-> (\A b11918 \in {([a |-> 1, b |-> TRUE]).a : b11919 \in UNION {Nat, [a |-> 1, b |-> TRUE]}} : (\E b11920 \in UNION {SUBSET {1}, SUBSET {1}} : (SUBSET {1} = {2, 1, 3})))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 71 to line 14, col 74 of module random_07727 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 69.
    | Expression starting at line 14, column 68.
    | ExtendableExpr starting at line 14, column 67.
    | ExtendableExpr starting at line 14, column 25.
    | Expression starting at line 14, column 25.
    | Fatal errors while parsing TLA+ spec in file random_07727
    | In module random_07727
    | Could not parse module random_07727 from file random_07727.tla
    | *** Errors: 1
    | In module random_07727
    | Could not parse module random_07727 from file random_07727.tla
    3002:1 Parsing or semantic analysis failed.
---*)
