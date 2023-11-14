function Get-CardDetails {
    param (
        [string]$cardName
    )

    try {
        $response = Get-ScryfallCardDetails -cardName $cardName
        if ($response.object -ne "card") {
            throw "Card not found"
        }

        $rulesText = $response.oracle_text -join "`n"
        $cardType = $response.type_line

        if ($response.card_faces -and $response.card_faces.Count -gt 0) {
            $cardCost = $response.card_faces[0].mana_cost
            $cardImageUrl = $response.image_uris.normal
        } else {
            $cardCost = $response.mana_cost
            $cardImageUrl = $response.image_uris.normal
        }

        return @{
            RulesText = $rulesText;
            CardType = $cardType;
            CardCost = $cardCost;
            CardImageUrl = $cardImageUrl
            CardName = $response.name
        }
    } catch {
        Write-Error "Error fetching card details: $_"
        throw $_
    }
}

function Get-ScryfallCardDetails {
    param (
        [string]$cardName
    )

    $apiUrl = "https://api.scryfall.com/cards/named?fuzzy=$($cardName -replace ' ', '%20')"
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get
    return $response
}

function Copy-CardImage {
    param (
        [string]$sourceImagePath,
        [string]$destinationDir
    )

    if (-not (Test-Path -Path $destinationDir)) {
        New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    }

    $filename = Split-Path -Leaf $sourceImagePath
    $destinationImagePath = Join-Path -Path $destinationDir -ChildPath $filename

    Copy-Item -Path $sourceImagePath -Destination $destinationImagePath -Force
    return $destinationImagePath
}
function Save-CardImage {
    param (
        [pscustomobject]$CardDetails,
        [string]$DestinationDir,
        [switch]$WhatIf
    )

    try {
        $imageName = Join-Path -Path $DestinationDir -ChildPath "$($CardDetails.CardName).jpg"

        if ($WhatIf) {
            Write-Output "WhatIf: Image for $($CardDetails.CardName) would be saved to $imageName"
        }
        else {
            $response = Invoke-WebRequest -Uri $CardDetails.CardImageUrl -OutFile $imageName -ErrorAction Stop
            Write-Output "Downloaded image for $($CardDetails.CardName) to $imageName"
        }
    }
    catch {
        Write-Error "Error saving card image: $_"
         # Don't throw the error, just log it and continue to the next card
    }
}

function Read-DecklistXML {
    param (
        [string]$filePath
    )

    try {
        $fileContent = Get-Content -Path $filePath -Raw
        [xml]$xmlContent = $fileContent

        # Accessing elements in the XML
        $deckName = $xmlContent.Decklist.Deck
        $designGoal = $xmlContent.Decklist.DesignGoal

        $cards = @()

        # Loop through Card elements
        $xmlContent.Decklist.Card | ForEach-Object {
            $card = @{
                Name = $_.Name
                Quantity = $_.Quantity
                Type = $_.Type
                Cost = $_.Cost
                RulesText = $_.RulesText
            }
            $cards += New-Object PSObject -Property $card
        }

        # Outputting the deck information
        $deckInfo = @{
            DeckName = $deckName
            DesignGoal = $designGoal
            Cards = $cards
        }
        return $deckInfo
    }
    catch {
        Write-Error "Error reading XML file: $_"
        throw $_
    }
}
function Save-CardImagesFromXML {
    [cmdletbinding()]
    param (
        [pscustomobject]$deck,
        [string]$destinationDir,
        [switch]$WhatIf
    )

    try {
        # Loop through Card elements
        foreach ($card in $deck.cards) {
            $carddetails = Get-CardDetails -cardName $card.name
            Save-CardImage -CardDetails $carddetails -destinationDir $destinationDir -WhatIf:$WhatIf
        }
    }
    catch {
        Write-Error "Error downloading card images: $_"
        throw $_
    }
}


# Usage example
$decks = Get-Childitem -Path .\xml\b*.xml
foreach ($deck in $decks){
    $cards = Read-DecklistXML -filePath $deck.Fullname
    Save-CardImagesFromXML -deck $cards -destinationDir .\assets\magicimages\ -WhatIf
}
$cards = Read-DecklistXML -filePath .\xml\affinity.xml
Save-CardImagesFromXML -deck $cards -destinationDir .\assets\magicimages\

$response = Receive-CardImage -CardDetails $CardInfo -destinationDir ".\assets\magicimages\"