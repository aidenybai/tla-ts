(*---
description: Evaluates a random record expression, seed 262, number 5689.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05689 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{Head((<<>> \o <<1>>)), IF ({1, 2} = {1}) THEN (--1) ELSE (1 % [x \in Nat |-> x + 1])} EXCEPT !.a = LET b8767 == IF (1 <=> FALSE) THEN CASE TRUE -> 7 [] OTHER -> 0 ELSE {2147483647 : b8768 \in {1, 2}} IN CASE (b8767 = b8767) -> (b8767 % b8767) [] OTHER -> Len(<<1>>)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 67 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 64.
    | Expression starting at line 14, column 64.
    | IF THEN ELSE starting at line 14, column 41.
    | Expression starting at line 14, column 41.
    | Some { } form starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_05689
    | In module random_05689
    | Could not parse module random_05689 from file random_05689.tla
    | *** Errors: 1
    | In module random_05689
    | Could not parse module random_05689 from file random_05689.tla
    3002:1 Parsing or semantic analysis failed.
---*)
