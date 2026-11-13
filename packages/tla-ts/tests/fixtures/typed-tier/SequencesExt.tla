---- MODULE SequencesExt ----
\* FlattenSeq as CommunityModules' SequencesExt defines it.
EXTENDS Naturals, Sequences

FlattenSeq(seqs) ==
  IF Len(seqs) = 0 THEN seqs ELSE
    \* Not via  FoldSeq(\o, <<>>, seqs)  here to support strings with TLC.
    LET flatten[i \in 1..Len(seqs)] ==
        IF i = 1 THEN seqs[i] ELSE flatten[i-1] \o seqs[i]
    IN flatten[Len(seqs)]
====
