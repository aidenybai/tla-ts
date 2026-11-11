(*---
description: Evaluates a random record expression, seed 262, number 9478.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09478 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((<<2147483647, -1>> = [<<5, 6>> EXCEPT ![3] = 2147483647]) => ((CHOOSE r \in [a : 1..2] : TRUE) = [a |-> 7, b |-> TRUE])) \subseteq {UNION {(SUBSET {1} \cup {1}), (SUBSET {1} = b14726)} : b14726 \in ((--1) .. <<2, 3>>)}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 221 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 218.
    | Expression starting at line 14, column 218.
    | ExtendableExpr starting at line 14, column 217.
    | Expression starting at line 14, column 217.
    | Quant Bound starting at line 14, column 206.
    | Fatal errors while parsing TLA+ spec in file random_09478
    | In module random_09478
    | Could not parse module random_09478 from file random_09478.tla
    | *** Errors: 1
    | In module random_09478
    | Could not parse module random_09478 from file random_09478.tla
    3002:1 Parsing or semantic analysis failed.
---*)
