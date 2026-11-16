(*---
description: Evaluates a random record expression, seed 262, number 8302.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08302 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((TRUE /\ FALSE) \/ (<<1>> = [x \in Nat |-> x + 1])) -> (CHOOSE b12847 \in ({} \ {1, 2}) : (\A b12848 \in {x \in 1..3 : x > 1} : FALSE)) [] OTHER -> SubSeq(Tail(<<>>), Len(<<>>), (--1)), b |-> ([(<<>> \o <<1, 2>>) EXCEPT ![1] = Head(<<>>)] = (Len(<<>>) :> (-1 % -1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 210 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 207.
    | Expression starting at line 14, column 207.
    | Optional Arguments starting at line 14, column 183.
    | Primitive expression starting at line 14, column 177.
    | ExtendableExpr starting at line 14, column 177.
    | Fatal errors while parsing TLA+ spec in file random_08302
    | In module random_08302
    | Could not parse module random_08302 from file random_08302.tla
    | *** Errors: 1
    | In module random_08302
    | Could not parse module random_08302 from file random_08302.tla
    3002:1 Parsing or semantic analysis failed.
---*)
