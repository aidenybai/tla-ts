(*---
description: Evaluates a random function expression, seed 262, number 4357.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04357 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [2..1 -> {1}] : TRUE) EXCEPT ![Cardinality((UNION {2..1, {1}} \cap DOMAIN [x \in Nat |-> x + 1]))] = ([b6864 \in (3 .. 1) |-> Len(<<1>>)])[((1 * -1) \div Cardinality({}))]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 174 to line 14, col 174 of module random_04357 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 172.
    | Expression starting at line 14, column 172.
    | ExtendableExpr starting at line 14, column 171.
    | Expression starting at line 14, column 171.
    | ExtendableExpr starting at line 14, column 170.
    | Fatal errors while parsing TLA+ spec in file random_04357
    | In module random_04357
    | Could not parse module random_04357 from file random_04357.tla
    | *** Errors: 1
    | In module random_04357
    | Could not parse module random_04357 from file random_04357.tla
    3002:1 Parsing or semantic analysis failed.
---*)
