---- MODULE DomainFunctions ----
EXTENDS Naturals, Sequences
VARIABLES arr
Bijections(S) == {f \in [S -> S] : \A y \in S : \E x \in S : f[x] = y}
Permutations(s) == {[x \in DOMAIN s |-> s[f[x]]] : f \in Bijections(DOMAIN s)}
Init == arr \in {<<1, 2, 3>>, <<2, 2>>, <<>>}
Next == \E p \in Permutations(arr) : arr' = p
Sized == \A p \in Permutations(arr) : Len(p) = Len(arr)
====
