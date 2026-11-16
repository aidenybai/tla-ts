(*---
description: Evaluates a random int expression, seed 262, number 2059.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02059 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(([Tail(<<1>>) EXCEPT ![1] = LET b3277 == 0 IN 7] \o <<(--1), (<<3, 1, 2>>)[-1]>>), CASE (([a |-> 1, b |-> TRUE] = 1) \/ (3 = [a |-> 1, b |-> TRUE])) -> (Len(<<1>>) % Cardinality({1})) [] OTHER -> (CHOOSE b3278 \in {b3279 : b3279 \in {1, 2}} : (<<1, 2>> = (1 :> 2))), (Len(SubSeq(<<1, 2>>, -1, 0)) * DOMAIN [<<5, 6>> EXCEPT ![0] = 7])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 80 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 77.
    | Expression starting at line 14, column 77.
    | Some << -- >> or >>_ Form starting at line 14, column 75.
    | ExtendableExpr starting at line 14, column 75.
    | ExtendableExpr starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_02059
    | In module random_02059
    | Could not parse module random_02059 from file random_02059.tla
    | *** Errors: 1
    | In module random_02059
    | Could not parse module random_02059 from file random_02059.tla
    3002:1 Parsing or semantic analysis failed.
---*)
