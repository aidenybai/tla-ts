---- MODULE Action ----
EXTENDS Naturals, TLC
VARIABLE x

Unnamed ==
  [ name |-> "UnnamedAction",
    location |->
      [ beginLine |-> 0,
        beginColumn |-> 0,
        endLine |-> 0,
        endColumn |-> 0,
        module |-> "--TLA+ BUILTINS--" ] ]

IsUnnamed(label) == Assert(TLCGet("action") = Unnamed, label)

ASSUME IsUnnamed("assumption")
Init == x = 0 /\ IsUnnamed("initial predicate")
Inc == x < 2 /\ x' = x + 1 /\ IsUnnamed("next-state relation")
Next == Inc
Inv == IsUnnamed("invariant")
Constraint == IsUnnamed("constraint")
ActionConstraint == IsUnnamed("action constraint")
Post == IsUnnamed("postcondition")
Prop == [][IsUnnamed("action property")]_x
====
