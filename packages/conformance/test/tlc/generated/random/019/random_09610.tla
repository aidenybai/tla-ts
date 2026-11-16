(*---
description: Evaluates a random bool expression, seed 262, number 9610.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09610 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b14920 \in DOMAIN (1 :> 0) : [(b14920 :> -1) EXCEPT ![([a |-> 1, b |-> TRUE]).a] = (CHOOSE b14921 \in {x \in 1..3 : x > 1} : FALSE)]) => ([a |-> (2147483647 + 1), b |-> (~TRUE)] = [a |-> (--1), b |-> (\A b14922 \in Nat : TRUE)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 211 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 208.
    | Expression starting at line 14, column 208.
    | Field Value starting at line 14, column 202.
    | Some [] Form starting at line 14, column 201.
    | ExtendableExpr starting at line 14, column 201.
    | Fatal errors while parsing TLA+ spec in file random_09610
    | In module random_09610
    | Could not parse module random_09610 from file random_09610.tla
    | *** Errors: 1
    | In module random_09610
    | Could not parse module random_09610 from file random_09610.tla
    3002:1 Parsing or semantic analysis failed.
---*)
