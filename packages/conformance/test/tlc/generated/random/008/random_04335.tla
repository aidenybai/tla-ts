(*---
description: Evaluates a random function expression, seed 262, number 4335.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04335 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(Head(<<1>>) :> (-0)) EXCEPT ![(-(2147483647 * -1))] = Cardinality((Nat \ Nat))] @@ [[b6828 \in UNION {SUBSET {1}, {}} |-> (b6828 % b6828)] EXCEPT ![((--1) % (-0))] = IF ([a |-> 1, b |-> TRUE] <=> TRUE) THEN SelectSeq(<<1>>, LAMBDA e : e > 0) ELSE Head(<<>>)]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 63 to line 14, col 63 of module random_04335 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 52.
    | Expression starting at line 14, column 52.
    | ExtendableExpr starting at line 14, column 51.
    | Expression starting at line 14, column 50.
    | ExtendableExpr starting at line 14, column 49.
    | Fatal errors while parsing TLA+ spec in file random_04335
    | In module random_04335
    | Could not parse module random_04335 from file random_04335.tla
    | *** Errors: 1
    | In module random_04335
    | Could not parse module random_04335 from file random_04335.tla
    3002:1 Parsing or semantic analysis failed.
---*)
