(*---
description: Evaluates a random bool expression, seed 262, number 340.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00340 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq((Append(<<1, 2>>, 3) \o SortSeq(<<>>, LAMBDA p, q : p < q)), ((2147483647 + 7) % (SUBSET {1} - -1)), (LET b570 == 0 IN 7 + Cardinality(1..3))) = [[(1 :> 3) EXCEPT ![IF [a |-> 1, b |-> TRUE] THEN [a |-> 1] ELSE 2147483647] = CASE TRUE -> {1} [] OTHER -> 0] EXCEPT ![LET b571 == IF TRUE THEN 2 ELSE -1 IN CASE FALSE -> 2147483647 [] OTHER -> 7] = ((CHOOSE f \in [{1, 2} -> 1..2] : TRUE))[(--1)]]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 106 to line 14, col 111 of module random_00340 and -.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 113.
    | Expression starting at line 14, column 106.
    | ExtendableExpr starting at line 14, column 105.
    | ExtendableExpr starting at line 14, column 86.
    | Expression starting at line 14, column 86.
    | Fatal errors while parsing TLA+ spec in file random_00340
    | In module random_00340
    | Could not parse module random_00340 from file random_00340.tla
    | *** Errors: 1
    | In module random_00340
    | Could not parse module random_00340 from file random_00340.tla
    3002:1 Parsing or semantic analysis failed.
---*)
