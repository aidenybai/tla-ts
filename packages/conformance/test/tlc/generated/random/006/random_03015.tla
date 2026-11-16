(*---
description: Evaluates a random set expression, seed 262, number 3015.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03015 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(DOMAIN ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) \ (IF FALSE THEN 7 ELSE 0 .. (--1))), UNION {({0 : b4790 \in {1, 2}} \cup (2..1 \cup {2, 1, 3})), {(--1), (0 % 7)}}})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 109 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 106.
    | ExtendableExpr starting at line 14, column 101.
    | Expression starting at line 14, column 101.
    | IF THEN ELSE starting at line 14, column 80.
    | Expression starting at line 14, column 80.
    | Fatal errors while parsing TLA+ spec in file random_03015
    | In module random_03015
    | Could not parse module random_03015 from file random_03015.tla
    | *** Errors: 1
    | In module random_03015
    | Could not parse module random_03015 from file random_03015.tla
    3002:1 Parsing or semantic analysis failed.
---*)
