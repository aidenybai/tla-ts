(*---
description: Evaluates a random function expression, seed 262, number 4714.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04714 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((--1) % CASE TRUE -> 7 [] OTHER -> 2) :> ((2147483647 - -1) - (-{1, 2}))) EXCEPT ![Head(SubSeq([<<1>> EXCEPT ![1] = 7], Len(<<>>), Head(<<1, 2>>)))] = CASE ((~TRUE) <=> ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) -> CASE (~FALSE) -> (2 % [x \in Nat |-> x + 1]) [] OTHER -> Head(<<1>>) [] OTHER -> IF (-1 \in {1}) THEN (-1 + 2) ELSE Len(<<>>)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 22 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_04714
    | In module random_04714
    | Could not parse module random_04714 from file random_04714.tla
    | *** Errors: 1
    | In module random_04714
    | Could not parse module random_04714 from file random_04714.tla
    3002:1 Parsing or semantic analysis failed.
---*)
