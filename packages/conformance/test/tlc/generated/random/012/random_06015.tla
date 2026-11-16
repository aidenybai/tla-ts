(*---
description: Evaluates a random function expression, seed 262, number 6015.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06015 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9262 \in (((2..1 \ 1..3) \cup DOMAIN <<5, 6>>) \cup {([a |-> 1, b |-> TRUE]).a : b9263 \in {7 : b9264 \in {}}}) |-> (UNION {(Nat \ {}), {b9265 \in Nat : FALSE}} - IF ([a |-> 1] <=> TRUE) THEN (CHOOSE b9266 \in {} : FALSE) ELSE (7 \div (1 :> 2)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 135 to line 14, col 139 of module random_06015 and -.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 141.
    | Expression starting at line 14, column 135.
    | ExtendableExpr starting at line 14, column 134.
    | Expression starting at line 14, column 134.
    | Some [] Form starting at line 14, column 16.
    | Fatal errors while parsing TLA+ spec in file random_06015
    | In module random_06015
    | Could not parse module random_06015 from file random_06015.tla
    | *** Errors: 1
    | In module random_06015
    | Could not parse module random_06015 from file random_06015.tla
    3002:1 Parsing or semantic analysis failed.
---*)
