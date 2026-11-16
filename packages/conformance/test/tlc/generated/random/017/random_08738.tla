(*---
description: Evaluates a random set expression, seed 262, number 8738.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08738 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b13533 \in {Head(<<>>), Cardinality({x \in 1..3 : x > 1})} : ((--1) < ([a |-> 1]).a)) : b13532 \in ((CASE TRUE -> 2147483647 [] OTHER -> 0 .. (-1 % 1)) \cup UNION {(SUBSET {1} \ 2..1), UNION {Nat, SUBSET {1}}})})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 90 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 87.
    | Expression starting at line 14, column 87.
    | ExtendableExpr starting at line 14, column 86.
    | Expression starting at line 14, column 86.
    | (Un)Bounded Choose starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_08738
    | In module random_08738
    | Could not parse module random_08738 from file random_08738.tla
    | *** Errors: 1
    | In module random_08738
    | Could not parse module random_08738 from file random_08738.tla
    3002:1 Parsing or semantic analysis failed.
---*)
